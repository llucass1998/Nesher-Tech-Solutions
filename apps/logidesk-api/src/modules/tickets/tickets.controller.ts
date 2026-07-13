import { Body, Controller, Get, Headers, Param, Patch, Post, Query, UnauthorizedException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateTicketFromLogiflowDto } from './dto/create-ticket-from-logiflow.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  listTickets(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
  ) {
    return this.ticketsService.listTickets({
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(search ? { search } : {}),
    });
  }

  @Post('from-logiflow')
  createFromLogiflow(
    @Body() body: CreateTicketFromLogiflowDto,
    @Headers('x-service-token') serviceToken: string | undefined,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ) {
    this.assertServiceToken(serviceToken);
    return this.ticketsService.createFromLogiflow(body, idempotencyKey);
  }

  @Get(':id')
  getTicket(@Param('id') id: string) {
    return this.ticketsService.getTicket(id);
  }

  @Patch(':id')
  updateTicket(@Param('id') id: string, @Body() body: UpdateTicketDto) {
    return this.ticketsService.updateTicket(id, body);
  }

  @Post(':id/messages')
  createMessage(@Param('id') id: string, @Body() body: CreateMessageDto) {
    return this.ticketsService.createMessage(id, body);
  }

  @Post(':id/notes')
  createNote(@Param('id') id: string, @Body() body: CreateMessageDto) {
    return this.ticketsService.createNote(id, body);
  }

  private assertServiceToken(serviceToken: string | undefined) {
    const expected = process.env.LOGIDESK_SERVICE_TOKEN;

    if (!expected || serviceToken !== expected) {
      throw new UnauthorizedException({ error: 'Invalid service token.' });
    }
  }
}
